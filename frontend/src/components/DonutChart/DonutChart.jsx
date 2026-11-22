import './DonutChart.scss'

const RADIUS = 70
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

// Counts of different things (companies, departments, employees) can differ by orders of magnitude,
// so the arcs use a log scale (log1p keeps 0 at 0) to keep every segment visible.
// The real numbers are shown in the legend and in the centre.
const weight = (value) => Math.log1p(Math.max(value, 0))

// segments: [{ label, value, color }]
const DonutChart = ({ segments, centerValue, centerLabel }) => {
    const total = segments.reduce((sum, segment) => sum + weight(segment.value), 0)

    const arcs = []
    let offset = 0
    if (total > 0) {
        for (const segment of segments) {
            const length = (weight(segment.value) / total) * CIRCUMFERENCE
            if (length === 0) continue
            arcs.push({ ...segment, length, offset })
            offset += length
        }
    }

    return (
        <div className="donut">
            <svg viewBox="0 0 200 200" role="img" aria-label={`${centerValue} ${centerLabel}`}>
                <circle className="donut__track" cx="100" cy="100" r={RADIUS} />
                {arcs.map((arc) => (
                    <circle
                        key={arc.label}
                        className="donut__arc"
                        cx="100"
                        cy="100"
                        r={RADIUS}
                        stroke={arc.color}
                        strokeDasharray={`${arc.length} ${CIRCUMFERENCE - arc.length}`}
                        strokeDashoffset={-arc.offset}
                        transform="rotate(-90 100 100)"
                    />
                ))}
            </svg>
            <div className="donut__center">
                <strong style={{ fontSize: String(centerValue).length > 7 ? 17 : 22 }}>{centerValue}</strong>
                <span>{centerLabel}</span>
            </div>
        </div>
    )
}

export default DonutChart
