document.addEventListener('DOMContentLoaded', () => {
    console.log("Portfolio Hub Initialized.");

    // You could add JavaScript here for:
    // - Filtering stories by tags (if you add them later)
    // - A simple slideshow if you have many stories
    // - Dynamic loading of story data if you get more advanced
    // For now, simple static links in HTML are fine.

    // Example: Add a little hover effect to cards using JS (though CSS is better for this)
    const storyCards = document.querySelectorAll('.story-card');
    storyCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            // You can add JS-driven hover effects here if needed
        });
        card.addEventListener('mouseleave', () => {
            // Reset effects
        });
    });
});