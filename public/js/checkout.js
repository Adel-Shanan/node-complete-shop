const orderBtn = document.getElementById('order-btn');

const stripe = Stripe(orderBtn.dataset.stripeKey);

orderBtn.addEventListener('click', () => {
    const sessionId = orderBtn.dataset.sessionId;

    stripe.redirectToCheckout({
        sessionId: sessionId
    });
});