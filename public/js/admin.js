const deleteProduct = (event) => {
    console.log("Clicked");

    const btn = event.target;
    console.log(btn);

    console.log(btn.parentNode.querySelector('[name=productId]'));

    const prodId = btn.parentNode.querySelector('[name=productId]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;

    const productElement = btn.closest('article');

    fetch('/admin/product/' + prodId , {

        method: 'DELETE',
        headers: {'csrf-token': csrf}

    }).then(result => {
        return result.json();
    }).then(data => {
        console.log(data);
        productElement.parentNode.removeChild(productElement);
    }).catch(err => {
        console.log(err);
    });

};


const deleteButtons = document.querySelectorAll('.delete');

deleteButtons.forEach(btn => {
    btn.addEventListener('click', deleteProduct);
});