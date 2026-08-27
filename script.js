(() => {
  'use strict';

  const PROMO_PRICE = 'R$ 139,90';

  const buttons = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.card[data-brand]');

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      buttons.forEach((item) => item.classList.remove('active'));
      button.classList.add('active');

      const filter = button.dataset.filter;
      cards.forEach((card) => {
        const categories = (card.dataset.category || '').split('|');
        const matches = filter === 'Todas'
          || card.dataset.brand === filter
          || categories.includes(filter);
        card.classList.toggle('is-hidden', !matches);
      });
    });
  });

  cards.forEach((card) => {
    const orderButton = card.querySelector('.order-btn');
    const sizeSelect = card.querySelector('.size-select');
    const title = card.dataset.title || 'produto';

    if (orderButton && sizeSelect) {
      orderButton.addEventListener('click', () => {
        if (!sizeSelect.value) {
          sizeSelect.focus();
          return;
        }

        const brand = card.dataset.brand || '';
        const message = encodeURIComponent(
          `Olá! Tenho interesse no modelo ${title}, marca ${brand}. Valor promocional: ${PROMO_PRICE}. Gostaria da numeração ${sizeSelect.value}.`
        );
        window.open(`https://wa.me/5562982382639?text=${message}`, '_blank');
      });
    }
  });
})();
