# merge-defaults

Takes a default object and an overide object and merges, or blends, them together.

## Why not use merge?

Default blender allows handling of special cases, matching on paths or values.

## Examples

### Basic use

```TypeScript
const defaults = {
   species: 'Human',
   planet: 'Earth',
}

const override = {
   name: 'James'
}

const james = blendDefaults(defaults, override )
```

```TypeScript
const defaults = {
   species: 'Human',
   planet: 'Earth',

}

const override = {
   name: 'Rex'
}

const rex = blendDefaults(defaults, override, {
    strategies: [
        {
            matcher: (match)=> match.path('species'),
            action: (action)=> action.setValue('Dog')
        }
    ]
} )
```
