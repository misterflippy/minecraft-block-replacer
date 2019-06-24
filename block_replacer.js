///Block replacer
///Author: mrflippy
///Replaces blocks with entities when the blocks are placed
///Usage: Drop this into your addon/behavior/scripts/server directory

//define the blocks and replacement entities
//key: block name
//val: entity name
var replacementDictionary = {
    //example: when player places a block of cobblestone, change it to a chicken
    "minecraft:cobblestone": "minecraft:chicken"
};

//set up the server system
var serverSystem = server.registerSystem(0, 0);

// Setup which events to listen for
serverSystem.initialize = function () {
    serverSystem.listenForEvent("minecraft:player_placed_block", (eventData) => serverSystem.onPlacedBlock(eventData));
}

serverSystem.onPlacedBlock = function (eventData) {
    let player = eventData.data.player;
    let position = eventData.data.block_position;

    //get player ticking area
    let tickingArea = serverSystem.getComponent(player, "minecraft:tick_world").data.ticking_area;

    if (position !== null && tickingArea) {
        //getBlock and check whether it's a block we want to replace
        let placedBlock = serverSystem.getBlock(tickingArea, position);

        //only continue if the block is in the replacement dictionary
        if (replacementDictionary.hasOwnProperty(placedBlock.__identifier__)) {
            
            //remove original placed block at position
            serverSystem.executeCommand(`/setblock ${position.x} ${position.y} ${position.z} air`, (commandResultData) => {
                //spawn the entity after the block is removed
                spawnEntity(replacementDictionary[placedBlock.__identifier__], position);
            });
        }
    }
}

//spawn an entity at location
//entityIdentifierName = the identifier name (e.g. "minecraft:pig")
//position = (x,y,z) coords at which to spawn the entity
function spawnEntity(entityIdentifierName, position) {
    let ent = serverSystem.createEntity("entity", entityIdentifierName);
    if (ent !== null) {
        //set the position
        //adjust entity position to be in the middle of the block square
        let ent_position = serverSystem.getComponent(ent, "minecraft:position");
        ent_position.data.x = position.x + 0.5;
        ent_position.data.y = position.y;
        ent_position.data.z = position.z + 0.5;

        serverSystem.applyComponentChanges(ent, ent_position);
    }
}
