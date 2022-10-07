![Behirut logo](src/assets/logo128.png)

# Behirut בהירות

Behirut [(clarity in Hebrew)](https://en.wiktionary.org/wiki/%D7%91%D7%94%D7%99%D7%A8%D7%95%D7%AA)
is a simple browser extension that makes reading Hebrew script text clearer and more pleasant.

This project is based on [Bassam Helal's](https://github.com/basshelal) app [Wudooh](https://wudooh.app/).

Behirut is a fork of Wudooh for Hebrew text.

## local

Install

```bash
git clone https://github.com/charlesLoder/Behirut.git
cd Behirut
npm install
```

To build

```bash
npm run build
```

If you get an error, you may need to create a dist folder first

```bash
mkdir dist
```

[Install on Chrome](https://webkul.com/blog/how-to-install-the-unpacked-extension-in-chrome/)

## Current Features

Behirut will update all Hebrew script text across the browser and modify it according
to the user's options.

Behirut will do this automatically to any Hebrew text, meaning even newly loaded
content with Hebrew text will also update and become clearer.

This is not just for Hebrew, but for any [Hebrew script ](https://en.wikipedia.org/wiki/Hebrew_alphabet), meaning this can work for Yiddish and ancient Caananite languages (provided they use the Hebrew code block)

### On/Off Switch

Behirut allows the user to turn on or off the extension using a quick toggle switch.

### Change Font

Behirut comes preloaded with open access fonts. All included fonts support the full range of Hebrew characters including niqqud and taamim, and are only a normal font stlye (i.e. no bold or italic)

Many of the fonts are from [The Culmus Project](https://culmus.sourceforge.io/index.html) and are available under the [GNU General Public License version 2](https://www.gnu.org/licenses/old-licenses/gpl-2.0.html)

[SIL Ezra](https://software.sil.org/ezra/) is available from SIL under the [SIL Open Font License](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL)

### Change Font Size

Behirut allows the user to change the size of the font from 100% (no change) to
200% larger. This will increase the scale of the fonts meaning the ratios between sizes
will remain the same.

### Change Line Height

Behirut allows the user to change the line height of Hebrew text from 100% (no change) to
200% larger. This goes well with the font size increase as the Hebrew script contains many
elements that go above and below the center of the line.

### Whitelist

Behirut allows the user to whitelist domains from being clarified. This will make Behirut ignore
any page on that domain. This is useful for websites that render text differently or have already clear Hebrew text.

### Live Updates

All Hebrew script text will be updated by Behirut, including newly loaded dynamic text such as
from YouTube comments and other social media websites. Make Hebrew Text Clear (Again?)!

Almost all option changes trigger live updates, this includes font change, font size
change and line height change. This means that as the user updates those options all Hebrew text
in all tabs will update to match those new settings. It is still recommended to refresh the page
however, as some empty spacing may be different.

### Safe Editables

Behirut will ignore any text in editable fields such as text areas, search boxes and others.
This was a major problem in Huruf that has been solved in Behirut.

## Contributing

This project is fully open source and I am accepting pull requests, especially those that fix issues.
The code is well documented and commented and should be easy to understand for a beginner.

All code must be in TypeScript, strongly typed and well documented, commented and structured.
My general rule of thumb is to be verbose to give as much detail as possible
(good names, allows show types, comment and document the code). Ambiguity causes bugs.

You are also welcome to fork this and use the same code to modify any other scripts such as
[CJK](https://en.wikipedia.org/wiki/CJK_characters).
Few modifications would need to be made, only the `arabicRegEx` `const` in
[`main.ts`](https://github.com/charlesLoder/Behirut/blob/main/src/main.ts)
would need to change within the TypeScript code (don't forget to compile to JavaScript).

`popup.html`, `styles.css` and `fonts.css` would need to be modified
to accommodate different fonts and a different UI feel, but generally speaking, few modifications would need
to be made, especially to the TypeScript code.

You are free to do this and publish it [(Behirut is MIT licensed)](https://github.com/charlesLoder/Behirut/blob/main/LICENSE)
but credit to Behirut would be greatly appreciated.

## Thanks

A harty thanks to [Bassam Helal](https://github.com/basshelal) for creating [Wudooh](https://github.com/basshelal/Wudooh) and making it open source.
