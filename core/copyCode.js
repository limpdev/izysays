// Codeblock Copy Buttons
// adds copy buttons to codeblocks (pre tags)
function addCopyButtons() {
    const defaultSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M17.997 4.17A3 3 0 0 1 20 7v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 2.003-2.83A4 4 0 0 0 10 8h4a4 4 0 0 0 3.98-3.597zM14 2a2 2 0 1 1 0 4h-4a2 2 0 1 1 0-4z"/></svg>';
    const successSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none"><path fill="currentColor" fill-opacity="0.16" d="M8 3H5.4A2.4 2.4 0 0 0 3 5.4v15.2A2.4 2.4 0 0 0 5.4 23h13.2a2.4 2.4 0 0 0 2.4-2.4V5.4A2.4 2.4 0 0 0 18.6 3H16v1.2a.8.8 0 0 1-.8.8H8.8a.8.8 0 0 1-.8-.8z"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 3h2.6A2.4 2.4 0 0 1 21 5.4v15.2a2.4 2.4 0 0 1-2.4 2.4H5.4A2.4 2.4 0 0 1 3 20.6V5.4A2.4 2.4 0 0 1 5.4 3H8m0 11l3 3l5-7M8.8 1h6.4a.8.8 0 0 1 .8.8v2.4a.8.8 0 0 1-.8.8H8.8a.8.8 0 0 1-.8-.8V1.8a.8.8 0 0 1 .8-.8"/></g></svg>';
    const preBlocks = document.querySelectorAll('pre');

    preBlocks.forEach((pre) => {
        const button = document.createElement('button');
        button.className = 'codebtn';
        button.innerHTML = defaultSVG;
        button.addEventListener('click', () => {
            navigator.clipboard.writeText(pre.innerText).then(() => {
                button.innerHTML = successSVG;
                setTimeout(() => {
                    button.innerHTML = defaultSVG;
                }, 2000);
            });
        });
        pre.parentNode.insertBefore(button, pre);
    })
}