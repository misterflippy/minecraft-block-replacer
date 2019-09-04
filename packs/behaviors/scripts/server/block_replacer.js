///Block replacer
///Author: mrflippy
///Replaces blocks with entities when the blocks are placed

//set up a global variable that points to global this
var global = {};
var global_replacer = {};

//identifier for the block replacer key
const _blockReplacerKey = "flippy_utils:block_replacer";

//set up the server system
var serverSystem = server.registerSystem(0, 0);

// Setup which events to listen for
serverSystem.initialize = function () {
    global = (0, eval)('this');

    //set up the global block replacer object
    global_replacer = global[_blockReplacerKey] = {
        //define the blocks and replacement entities
        //key: block name
        //val: key:val settings
        //entity_identifier: name of the entity to replace with
        replacementDictionary: {},

        //register a replacement 
        //block_identifier: the identifier of the block to replace
        //entity_identifier: the identifier of the entity to replace with
        registerReplacement: function (block_identifier, entity_identifier) {
            this.replacementDictionary[block_identifier] = {
                "entity_identifier": entity_identifier
            }
        }
    }
    
    //event listeners
    serverSystem.listenForEvent("minecraft:player_placed_block", (eventData) => serverSystem.onPlacedBlock(eventData));
}

serverSystem.update = function () {
}

serverSystem.chat = function (message) {
    const eventData = serverSystem.createEventData("minecraft:display_chat_event");
    eventData.data.message = message;
    serverSystem.broadcastEvent("minecraft:display_chat_event", eventData);
};

serverSystem.onPlacedBlock = function (eventData) {
    let player = eventData.data.player;
    let position = eventData.data.block_position;

    //get player ticking area
    let tickingArea = serverSystem.getComponent(player, "minecraft:tick_world").data.ticking_area;

    if (position !== null && tickingArea) {
        //getBlock and check whether it's a block we want to replace
        let placedBlock = serverSystem.getBlock(tickingArea, position);

        //only continue if the block is in the replacement dictionary
        if (global_replacer.replacementDictionary.hasOwnProperty(placedBlock.__identifier__)) {
            let replacementInfo = global_replacer.replacementDictionary[placedBlock.__identifier__];

            //remove original placed block at position
            serverSystem.executeCommand(`/setblock ${position.x} ${position.y} ${position.z} air`, (commandResultData) => {
                //spawn the entity after the block is removed
                spawnEntity(replacementInfo, position);
            });
        }
    }
}

//spawn an entity at location
//entityInfo = the entity replacement info
//position = (x,y,z) coords at which to spawn the entity
function spawnEntity(entityInfo, position) {
    let ent = serverSystem.createEntity("entity", entityInfo.entity_identifier);
    if (ent !== null) {
        //set the position
        //adjust entity position to be in the middle of the block square
        let ent_position = serverSystem.getComponent(ent, "minecraft:position");
        ent_position.data.x = position.x + 0.5;
        ent_position.data.y = position.y;
        ent_position.data.z = position.z + 0.5;

        serverSystem.applyComponentChanges(ent, ent_position);

        //removed immobile component -- use minecraft:pushable in the entity definition json file instead
    }
}
