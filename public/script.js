async function updateHouseColors() {
    try {
      const response = await fetch('/statuses.json');
      const data = await response.json();
  
      Object.keys(data).forEach(objectId => {
        const status = data[objectId];
        const el = document.querySelector(`[data-object-id="${objectId}"]`);
        if (!el) return;
  
        if (status === 'sold') {
          el.style.backgroundColor = '#FF6B6B';
          el.style.opacity = 0.7;
        } else if (status === 'available') {
          el.style.backgroundColor = '#4CAF50';
          el.style.opacity = 1;
        }
      });
    } catch (err) {
      console.error('Ошибка при обновлении цветов домов:', err);
    }
  }
  
  document.addEventListener('DOMContentLoaded', updateHouseColors);
  setInterval(updateHouseColors, 10000);
  