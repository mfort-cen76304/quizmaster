interface ItemListProps {
    readonly title: string
    readonly children: React.ReactNode
}

export const ItemList = ({ title, children }: ItemListProps) => (
    <section>
        <h3>{title}</h3>
        <div>{children}</div>
    </section>
)
