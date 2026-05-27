package hardware

import (
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/mem"
)

// SystemStats almacena la telemetría del sistema para ser enviada vía JSON.
type SystemStats struct {
	CPUUsage float64 `json:"cpu_usage"`
	RAMUsage float64 `json:"ram_usage"`
}

// GetStats lee el uso actual de CPU y RAM del hardware anfitrión.
func GetStats() (SystemStats, error) {
	var stats SystemStats

	// Obtenemos el porcentaje de CPU usado desde la última llamada (intervalo 0 evita bloqueo)
	cpuPercents, err := cpu.Percent(0, false)
	if err != nil {
		return stats, err
	}
	if len(cpuPercents) > 0 {
		stats.CPUUsage = cpuPercents[0]
	}

	// Obtenemos el estado de la memoria virtual (RAM)
	vMem, err := mem.VirtualMemory()
	if err != nil {
		return stats, err
	}
	stats.RAMUsage = vMem.UsedPercent

	return stats, nil
}
