Please adhere to the following design guidelines when developing for Cocoda.

You can use the mentioned CSS classes in one of two ways:

1. Add them to the classes list of your HTML element (recommended).
2. Extend your CSS class using [LESS](http://lesscss.org): `&:extend(.font-heavy);`

### Fonts

* **Font size** must only be set via one of the CSS classes `fontSize-small`, `fontSize-normal`, and `fontSize-large` (as defined in `src/style/text-styles.less`). The latter must only be use in the navigation bar and component placeholders.

* Use CSS class `fontWeight-heavy` for **bold font markup**.

### Colors

For interface elements, there is a range of pre-defined colors available in `src/style/colors.less`. For non-linked text, please use one of the following colors:

* CSS class `text-dark`
* CSS class `text-grey`
* CSS class `text-lightGrey`

### Tables

For tables, there is a custom table component called [FlexibleTable](#flexbiletable). It can be used very similarly to a [bootstrap-vue table](https://bootstrap-vue.js.org/docs/components/table). See components [MappingBrowser](#mappingbrowser) and [OccurrencesBrowser](#occurrencesbrowser) for examples of this in use.

### Buttons

For text buttons, there are predefined CSS classes in `src/style/main.less`. In particular, there are:

* CSS class `button`
* CSS class `button-disabled` (to be applied when a button is shown, but not clickable)

### Z-index values

If you need to use z-index values, please use the predefined LESS variables in `src/style/z-index.less`.

### Icons
Cocoda uses [Font Awesome](https://fontawesome.com/) for some icons. You can use any of their free icons (see their [icon gallery](https://fontawesome.com/icons?d=gallery&m=free)) like this:

```html
<font-awesome-icon icon="plus-circle" />
```

Remember to import FontAwesome (`import FontAwesomeIcon from "@fortawesome/vue-fontawesome"`) and add it to your components list.

As of now, all icons are available without importing them separately. But at some point in the future, we will only add those icons to the project that are needed to save same space. At that point, new icons will need to be imported in your components as well.
