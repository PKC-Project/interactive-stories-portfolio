document.addEventListener('DOMContentLoaded', () => {

    console.log("Interactive Journeys Library Initialized.");

    // --- Horizontal Drag-to-Scroll Functionality ---
    // This adds a nice "grab and drag" feel to the carousels,
    // improving the user experience on desktop.

    const carousels = document.querySelectorAll('.story-carousel');

    carousels.forEach(carousel => {
        let isDown = false;
        let startX;
        let scrollLeft;

        carousel.addEventListener('mousedown', (e) => {
            isDown = true;
            carousel.style.cursor = 'grabbing';
            startX = e.pageX - carousel.offsetLeft;
            scrollLeft = carousel.scrollLeft;
        });

        carousel.addEventListener('mouseleave', () => {
            isDown = false;
            carousel.style.cursor = 'grab';
        });

        carousel.addEventListener('mouseup', () => {
            isDown = false;
            carousel.style.cursor = 'grab';
        });

        carousel.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - carousel.offsetLeft;
            const walk = (x - startX) * 2; // The '2' is a scroll speed multiplier
            carousel.scrollLeft = scrollLeft - walk;
        });

        // Set initial cursor style
        carousel.style.cursor = 'grab';
    });

    // --- Future Enhancements Could Go Here ---
    // For example, a "lazy loading" function for thumbnails if the
    // library becomes very large, or animations for cards as they
    // scroll into view. For now, the CSS handles the core experience.

});