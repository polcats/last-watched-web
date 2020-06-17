function getFullDate() {
    let d = new Date();

    return d.getDate() + "/" + d.getMonth() + "/" + d.getFullYear();
}

function sanitizeText(text) {
    return text.replace(/[^a-zA-Z0-9_.]/gim, "");
}

function sanitizeTextWithSpaces(text) {
    return text.replace(/[^a-zA-Z0-9_. ]/gim, "");
}

function sanitizeTextExtended(text) {
    return text.replace(/[^a-zA-Z0-9_.?!-:;, ]/gim, "");
}

function sanitizeEmail(text) {
    return text.replace(/[^a-zA-Z0-9_@.]/gim, "");
}

module.exports.getFullDate = getFullDate;
module.exports.sanitizeText = sanitizeText;
module.exports.sanitizeEmail = sanitizeEmail;
module.exports.sanitizeTextWithSpaces = sanitizeTextWithSpaces;
module.exports.sanitizeTextExtended = sanitizeTextExtended;
