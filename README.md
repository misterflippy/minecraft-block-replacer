# minecraft-block-replacer
Replaces blocks with entities when the blocks are placed. This add-on is designed to be used by other add-ons and will not do much on its own.

## Installing
1. Double-click the .mcaddon file to install the add-on to Minecraft

## Configure
1. Add a dependency to your behavior pack manifest and add the minecraft-block-replacer UUID and version. This will automatically load the Block Replacer add-on when your behavior pack is added to a world.

```json
"dependencies": [
    {
        "uuid": "3725AD81-8CF0-49F4-B25E-20C152D759DC",
        "version": [
            3,0,0
        ]
    }
  ]
```

**Important:** When added to a world, the Block Replacer add-on must be in "Active Behavior Pack" list **below** packs that use it. This ensures it will load before the packs attempt to use it. Setting the dependency should handle this automatically.

2. In your server script initialize function, get a reference to the global block_replacer object:

Example:
```javascript
serverSystem.initialize = function(){
  let block_replacer = (0, eval)('this')["flippy_utils:block_replacer"];
}
```

3. Register your block -> entity replacements using the block_replacer.registerReplacement function.
```javascript
function registerReplacement(block_identifier, entity_identifier, is_immobile = false)
```
This function has 3 parameters:
  1. block_identifier: The identifier of the block to replace (e.g. "minecraft:cobblestone")
  2. entity_identifier: The identifier of the entity to replace with (e.g. "minecraft:chicken")
  3. is_immobile: Whether the script should make the entity immobile at the placed location
  
Example:
```javascript
//this will cause placed cobblestone to be replaced by a chicken. The chicken will not be able to move from the placed location.
block_replacer.registerReplacement("minecraft:cobblestone", "minecraft:chicken", true);
```

