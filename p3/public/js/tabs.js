document.addEventListener("DOMContentLoaded", function() {
    const tabs = document.querySelectorAll(".tab");
    const contents = document.querySelectorAll(".content");

    tabs.forEach(tab => {
        tab.addEventListener("click", function() {
            // Remove 'active' class from all tabs and hide all content
            tabs.forEach(t => t.classList.remove("active"));
            contents.forEach(content => content.style.display = "none");

            // Add 'active' class to the clicked tab and show the corresponding content
            this.classList.add("active");
            const contentId = this.id.replace("-tab", "-content");
            document.getElementById(contentId).style.display = "block";
        });
    });

    // Show the default content (Food) when the page loads
    document.getElementById("food-content").style.display = "block";
});
