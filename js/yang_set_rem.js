



//scss移动端自适应
window.addEventListener('orientationchange', setRem);
window.addEventListener('resize', setRem);
setRem();
function setRem() {
    var html = document.querySelector('html');
    var width = html.getBoundingClientRect().width;
    html.style.fontSize = width / 16 + 'px'
}






