export function capitalize(string) {
    if (!string) { return }
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function modsToList(mods) {
    return mods.map((s) => s[0]);
}

export function modsListToVerList(mods) {
    return Object.fromEntries(mods)
}

export function format(num) {
    return Intl.NumberFormat('en-US', {
        notation: "compact",
        maximumFractionDigits: 1
    }).format(num);
}

