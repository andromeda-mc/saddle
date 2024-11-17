export function modsToList(mods) {
    return mods.map((s) => s[0]);
}

export function format(num) {
    return Intl.NumberFormat('en-US', {
        notation: "compact",
        maximumFractionDigits: 1
    }).format(num);
}

