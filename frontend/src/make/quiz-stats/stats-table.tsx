interface StatsTableProps {
    readonly testId: string
    readonly caption: string
    readonly columns: readonly string[]
    readonly rows: readonly (readonly string[])[]
}

export const StatsTable = ({ testId, caption, columns, rows }: StatsTableProps) => (
    <table data-testid={testId}>
        <caption>{caption}</caption>
        <thead>
            <tr>
                {columns.map(col => (
                    <th key={col}>{col}</th>
                ))}
            </tr>
        </thead>
        <tbody>
            {rows.map((row, i) => (
                <tr key={i}>
                    {row.map((cell, j) => (
                        <td key={j}>{cell}</td>
                    ))}
                </tr>
            ))}
        </tbody>
    </table>
)
