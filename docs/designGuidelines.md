Please adhere to the following design guidelines when developing for Cocoda.

You can use the mentioned CSS classes in one of two ways:

1. Add them to the classes list of your HTML element.
2. Extend your CSS class using [LESS](http://lesscss.org): `&:extend(.font-heavy);`

### Font Size
Cocoda uses three font sizes:
- 0.8em (CSS class `font-size-small`)
- 1em (CSS class `font-size-normal`)
- 1.2em (CSS class `font-size-large`, only to be used in navigation bar and component placeholders)

Use other font sizes for icons only, not for text.

### Font Weight
Cocoda uses two font weights:
- 400 (CSS class `.font-normal`)
- 700 (CSS class `.font-heavy`)

### Colors
For interface elements, there is a range of pre-defined colors available in `src/style/main.less`. For non-linked text, please use one of the following colors:
- hsl(0, 0%, 13%) (CSS class `text-dark`)
- hsl(0, 0%, 29%) (CSS class `text-grey`)
- hsl(0, 0%, 45%) (CSS class `text-light-grey`)

### Tables
In main.less there are some predefined table styles to be used on bootstrap-vue tables. You can use it like this:

```html
<b-table
  :items="items"
  :fields="fields"
  class="defaultTable"
  small
  thead-class="defaultTableHead"
  tbody-class="defaultTableBody" />
```

Or, if you need to define slots:

```html
<b-table
  :items="items"
  :fields="fields"
  class="defaultTable"
  small
  thead-class="defaultTableHead"
  tbody-class="defaultTableBody">
  <span
    slot="someColumn"
    slot-scope="data">
    <!-- do something with data -->
  </span>
</b-table>
```

Note that `items` and `fields` have to be defined in the component. Also, if you need to define CSS classes for your columns, you need to do that in the global CSS of your component. See components [MappingBrowser](#mappingbrowser) and [OccurrencesBrowser](#occurrencesBrowser) for examples of this in use.

### Icons
Cocoda uses [Font Awesome](https://fontawesome.com/) for some icons. You can use any of their free icons (see their [icon gallery](https://fontawesome.com/icons?d=gallery&m=free)) like this:

```html
<font-awesome-icon icon="plus-circle" />
```

Remember to import FontAwesome (`import FontAwesomeIcon from "@fortawesome/vue-fontawesome"`) and add it to your components list.

As of now, all icons are available without importing them separately. But at some point in the future, we will only add those icons to the project that are needed to save same space. At that point, new icons will need to be imported in your components as well.
