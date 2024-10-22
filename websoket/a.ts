
// Create another Map to hold positions, using string keys and userMap as values
const position = new Map<string, Map<string, {userId:number}>>();


// Example of adding userMap to position
position.set('position1', );

// Function to access all values from the nested Maps
function accessAllValues() {
    // Iterate through the position map
    for (const [positionKey, userMap] of position) {
        console.log(`Position: ${positionKey}`);
        
        // Iterate through each userMap to access user data
        for (const [userKey, userValue] of userMap) {
            console.log(userValue.name);
        }
    }
}

// Call the function to display all values
accessAllValues();
