Here's a comprehensive Markdown template that demonstrates various formatting features either _supported_ or _will be supported_ by the current version of the `Izysays` Markdown-to-HTML renderer:

#  Markdown Features

## Headers
# H1 Header
## H2 Header
### H3 Header
#### H4 Header
##### H5 Header
###### H6 Header

## Text Formatting

- **Bold text**
- *Italic text*
- ~~Strikethrough text~~
- `Inline code`
- ==Highlighting==
- _Underlined text_
- H_-2-_O (Subscript)
- x^2^ (Superscript)

## Lists

### Unordered

- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
    - Deeply nested item

### Ordered

1. First item
2. Second item
   1. Nested ordered
   2. Another nested
3. Third item

## Code Blocks

### Inline

Use `printf()` for output.

### Block

```python
def hello_world():
    print("Hello, World!")
    return True
```

### Syntax Highlighting

```javascript
function test() {
  console.log("Syntax highlighting");
  return 0;
}
```

## Links and Images

- [Regular link](https://example.com)
- [Link with title](https://example.com "Example Title")

![Image alt text](image.jpg "Image title")

## Blockquotes

> Standard blockquote
> spanning multiple lines

> ### Fancy blockquote
>
> With **markdown** inside
> > Nested blockquote

## Tables

| Syntax    | Description |
| --------- | ----------- |
| Header    | Title       |
| Paragraph | Text        |

| Left-aligned | Center-aligned | Right-aligned |
| :----------- | :------------: | ------------: |
| Left         |     Center     |         Right |

## Horizontal Rule

---
or
***
or
___

## Special Features

### Task Lists

- [x] Completed task
- [ ] Incomplete task
  - [ ] Sub-task

### Footnotes

Here's a sentence with a footnote.[^1]

[^1]: This is the footnote.

### Definition Lists

Term 1
: Definition 1

Term 2
: Definition 2

### Emoji

:smile: :heart: :rocket: (if supported)

### Custom Containers

> [!NOTE]
> Should support GFM custom blockquotes...

> [!TIP]
> ...As well as Docusaurus' Admonition syntax!

::: info
This is an info box
:::

::: warning
This is a warning
:::

## Math (if supported)

Inline math: $E = mc^2$

Block math:

$$
\sum_{i=1}^n i = \frac{n(n+1)}{2}
$$

## Miscellaneous
- Escaped characters: \*not italic\*
- HTML: <span style="color:red">Red text</span> (if HTML is allowed)


This template covers most standard Markdown features plus some extended syntax that many renderers support. You can modify it to include or exclude specific features based on what your renderer supports.
