package main

import (
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"time"

	"vue-os-daemon/hardware"

	"github.com/creack/pty"
	"github.com/gorilla/websocket"
)

// Configuración del upgrader de WebSocket, permitiendo conexiones del frontend (CORS)
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // En producción se debe restringir al origen de Vue
	},
}

// handleWebSocket gestiona las conexiones WebSocket entrantes en /ws.
// Soporta aislamiento mediante query parameters:
// - /ws?type=terminal -> Conexión dedicada a Pseudo-terminal (PTY) interactiva (sin ticker de telemetría).
// - /ws -> Conexión de telemetría de hardware regular.
func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error al actualizar la conexión a WebSocket:", err)
		return
	}
	defer conn.Close()

	// Identificar el propósito de la conexión para optimizar el tráfico
	isTerminal := r.URL.Query().Get("type") == "terminal"
	if isTerminal {
		log.Println("Cliente conectado al Kernel WebSocket - Modo Terminal (PTY)")
	} else {
		log.Println("Cliente conectado al Kernel WebSocket - Modo Telemetría")
	}

	// Canal para indicar la desconexión del cliente
	done := make(chan struct{})

	// Estructura de mensajes entrantes
	type WSMessage struct {
		Type string `json:"type"`
		Data string `json:"data"`
	}

	var ptyFile *os.File
	var ptyMutex sync.Mutex

	// Goroutine de Lectura: Procesa datos del WebSocket entrante
	go func() {
		defer close(done)
		defer func() {
			ptyMutex.Lock()
			if ptyFile != nil {
				log.Println("Cerrando proceso PTY asociado a la sesión de WebSocket.")
				ptyFile.Close()
				ptyFile = nil
			}
			ptyMutex.Unlock()
		}()

		for {
			var msg WSMessage
			err := conn.ReadJSON(&msg)
			if err != nil {
				log.Println("Cliente desconectado o error de lectura en WebSocket:", err)
				break
			}

			// Manejo de comandos dirigidos a la pseudo-terminal (PTY)
			if msg.Type == "pty_input" {
				ptyMutex.Lock()
				if ptyFile == nil {
					// Inicialización perezosa (Lazy) de la Pseudo-Terminal
					homeDir, err := os.UserHomeDir()
					var workspace string
					if err != nil {
						workspace = "./vue-workspace"
					} else {
						workspace = filepath.Join(homeDir, "Documentos", "vue-workspace")
					}
					// Crear directorio seguro de trabajo controlado
					_ = os.MkdirAll(workspace, 0755)

					cmd := exec.Command("bash")
					cmd.Dir = workspace
					// Configurar variables de entorno y soporte de colores ANSI de 256 colores
					cmd.Env = append(os.Environ(), "TERM=xterm-256color")

					f, err := pty.Start(cmd)
					if err != nil {
						log.Println("Error al iniciar Pseudo-terminal (PTY):", err)
						ptyMutex.Unlock()
						continue
					}
					ptyFile = f
					log.Printf("PTY creada exitosamente en el workspace seguro: %s", workspace)

					// Goroutine de salida de PTY: Escucha Stdout/Stderr de la shell y retransmite al WebSocket
					go func(pf *os.File) {
						buf := make([]byte, 1024)
						for {
							n, err := pf.Read(buf)
							if err != nil {
								// PTY cerrada o fin de lectura, terminar goroutine
								break
							}
							if n > 0 {
								// Enviar salida cruda encapsulada en JSON
								outMsg := map[string]string{
									"type": "pty_output",
									"data": string(buf[:n]),
								}
								_ = conn.WriteJSON(outMsg)
							}
						}
					}(ptyFile)
				}

				// Transmitir entrada (Stdin) al descriptor de la PTY
				if ptyFile != nil {
					_, _ = ptyFile.Write([]byte(msg.Data))
				}
				ptyMutex.Unlock()
			}
		}
	}()

	// Si la conexión es de tipo terminal, no enviamos telemetría de hardware periódica
	if isTerminal {
		<-done
		return
	}

	// Ticker para enviar la telemetría de hardware cada 1 segundo (Solo en conexiones de telemetría)
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	// Bucle infinito gestionando la telemetría o el cierre de la conexión
	for {
		select {
		case <-done:
			log.Println("Deteniendo el envío de telemetría por desconexión del cliente.")
			return
		case <-ticker.C:
			// Extraer estadísticas físicas reales
			stats, err := hardware.GetStats()
			if err != nil {
				log.Println("Error al leer estadísticas del hardware:", err)
				continue
			}

			// Enviar como JSON al frontend Vue
			err = conn.WriteJSON(stats)
			if err != nil {
				log.Println("Error al enviar telemetría al cliente:", err)
				return // Desconexión o error fatal, abortar
			}
		}
	}
}

func main() {
	// Exponer el endpoint para comunicación del OS Simulator
	http.HandleFunc("/ws", handleWebSocket)

	port := "8080"
	log.Printf("Iniciando el Kernel de Vue OS (Daemon) en http://localhost:%s", port)

	// Bloquea el hilo principal sirviendo la API
	err := http.ListenAndServe("localhost:"+port, nil)
	if err != nil {
		log.Fatalf("Error fatal al iniciar el servidor HTTP: %v", err)
	}
}
