///Block replacer
///Author: mrflippy
///Replaces blocks with entities when the blocks are placed
///Usage: Drop this into your addon/behavior/scripts/server directory

//set up a global variable that points to global this
var global = {};
var global_replacer = {};

//identifier for the immobile component
const _immobileComponentIdentifier = "flippy_utils:immobile";

//set up the server system
var serverSystem = server.registerSystem(0, 0);

// Setup which events to listen for
serverSystem.initialize = function () {
    global = (0, eval)('this');

    //set up the global block replacer object
    global_replacer = global["flippy_utils:block_replacer"] = {
        //define the blocks and replacement entities
        //key: block name
        //val: key:val settings
        //entity_identifier: name of the entity to replace with
        //immobile: true: the script will keep setting the location of the entity to the placed location
        replacementDictionary: {},

        //register a replacement 
        //block_identifier: the identifier of the block to replace
        //entity_identifier: the identifier of the entity to replace with
        //is_immobile: whether to keep the entity immobile at the placed location
        registerReplacement: function (block_identifier, entity_identifier, is_immobile = false) {
            this.replacementDictionary[block_identifier] = {
                "entity_identifier": entity_identifier,
                "is_immobile": is_immobile
            }
        }
    }
    
    //register components
    //immobile component to keep an entity in one place
    serverSystem.registerComponent(_immobileComponentIdentifier, { position: { x: 0, y: 0, z: 0 } });

    //queries
    //pull all entities with the immobile component
    serverSystem.immobileQuery = serverSystem.registerQuery();
    //not currently using the filter since custom components aren't persisted -- need to loop through all entities anyway
    //serverSystem.addFilterToQuery(serverSystem.immobileQuery, _immobileComponentIdentifier);

    //event listeners
    serverSystem.listenForEvent("minecraft:player_placed_block", (eventData) => serverSystem.onPlacedBlock(eventData));
}

serverSystem.update = function () {
    //every tick:
    //pull all entities with "flippy_utils:immobile" component and set their location
    //TODO: need a way to handle reloading the world (pull all ents in replacement dictionary and add the component?)

    let ents = serverSystem.getEntitiesFromQuery(serverSystem.immobileQuery);
    for (let e = 0; e < ents.length; e++) {
        let ent = ents[e];

        //only process ents that are set up in the dictionary and should be immobile
        if (Object.values(global_replacer.replacementDictionary).find(d => d.entity_identifier === ent.__identifier__ && d.is_immobile)) {
            //get position component
            let position = serverSystem.getComponent(ent, "minecraft:position");

            //get the immobile component
            let immobile = serverSystem.getComponent(ent, _immobileComponentIdentifier);

            if (immobile === null) {
                immobile = addImmobleComponent(ent, position.data);
            }

            position.data.x = immobile.data.position.x;
            position.data.y = immobile.data.position.y;
            position.data.z = immobile.data.position.z;

            serverSystem.applyComponentChanges(ent, position);
        }
    }
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

        //add the immobile component if necessary
        if (entityInfo.is_immobile) {
            addImmobleComponent(ent, ent_position.data);
        }
    }
}

//adds the immoble component to an entity
//returns the immobile component
function addImmobleComponent(entity, position) {
    //create an "flippy_utils:immobile" component
    let immobileComponent = serverSystem.createComponent(entity, _immobileComponentIdentifier);

    //set the position
    immobileComponent.data.position = position;

    //save the changes
    serverSystem.applyComponentChanges(entity, immobileComponent);

    return immobileComponent;
}
