export const tagToColor = (tag: string): string => {
    let hash = 0
    for (let i = 0; i < tag.length; i++) {
        hash = (hash * 31 + tag.charCodeAt(i)) >>> 0
    }
    return `hsl(${hash % 360}, 65%, 45%)`
}
