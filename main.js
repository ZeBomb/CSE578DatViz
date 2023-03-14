// Global Vars

document.addEventListener('DOMContentLoaded', function () {
    console.log("In Script");
    pageBuilding()
    listeners()
});


/*
For any js needed to build the initial web page
*/
function pageBuilding() {

    //---- Date Slider ----//
    const dateRangeInput = document.getElementById('dateRange');
    //TODO: Add actual Start and end dates
    dateRangeInput.step = "1"
    dateRangeInput.min = 0; 
    dateRangeInput.max = 10;
    //TODO: Displa choosen dates

}


/*
For making any listeners
*/
function listeners(){

    //---- Tab listener ----//
    // Get all tab buttons and tab content elements
    const tabButtons = document.querySelectorAll('.tablinks');
    const tabContent = document.querySelectorAll('.tabcontent');

    // Add event listeners to each tab button
    tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
        // Remove active class from all tab buttons and tab content
        tabButtons.forEach((button) => button.classList.remove('active'));
        tabContent.forEach((content) => content.classList.remove('active'));

        // Add active class to the clicked button and corresponding tab content
        const tabID = button.id.replace('tab', 'tabContent');
        const activeTab = document.getElementById(tabID);
        button.classList.add('active');
        activeTab.classList.add('active');
    });
    });

    //---- Next Section ----//

};