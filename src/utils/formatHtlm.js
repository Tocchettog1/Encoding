export default function 
    formatHtml(html) {
        const text = html.replace(/<[^>]+>/g, '');

        const formattedText = text.replace(/\n/g, '')

        const finalText = `"${formattedText}"`

        return finalText;
}