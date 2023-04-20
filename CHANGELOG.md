# PrintingTools NG Changelog

## Versions

Version 2.2.2 : Maintenance Release - April 20, 2023

- Make Preview "Print Backgrounds" toggle with Use Background Color #187
- Add persistent printer option #188
- Add "msprompt" debug option to prompt for multiple selection printing 
- Fix header ordering issue in 'fr' locale
- Rewrite of UI for 'fr' locale
- Rewrite of UI for 'el' locale
- Update WL, fix wrench in addon manager

Version 2.2.1 : Maintenance Release - March 21, 2023

- Fix print failure after single ext FiltaQuila print, non PDF #179

Version 2.2.0 : PDF Output and Page Options - March 15, 2023

- Added PDF auto saving with token based names #151
- Added Page Options for page ranges, margins & headers and footers #118, #139
- New UI #159
- Improved Help #168
- Dark Mode Support #141
- Fixed not Printing Calendar #176
- Fixed not Printing with Conversations addon #177

Version 2.1.5 : Maintenance Release  - October 13, 2022

- Fix multiple selection printing #136

Version 2.1.4 : Thunderbird 103 Support - July 18, 2022

- Bump max version to 103.0
- Update HU locale - @efi99

Version 2.1.3 : Thunderbird 102 Support - June 21, 2022

- Thunderbird 102 and 91 compatibility 
- Added options to format fonts for both headers and body #120
- Improved options UI #124
- Fix printing of non email tabs #119
- Fix EML files with attachments showing NaN for file sizes #125
- Translation improvements for en-US and ja locales
Version 2.0.6 : 68/78/89+ Update - May 29, 2021

- Allow compatibility to 89+ (experimental support only) #66
- Add option: Use 'Cc' and 'Bcc' for all locales (otherwise localized)
- Make header dynamically sized to largest item
- Add option #67: Show p7m,p7s,vcf files
- Add debug option : use 'initialsource' and/or 'finaloutput' 
  in custom name field for output
- Fix #69  Set system option to allow custom fonts, inform user
- Fix 'From' in Chinese locale
- Various German, Japanese locale improvements

Again thanks for testers/localizers:
@RRoenn
@kiki-ja
@tidebre67 
@KC-T 
@madvinegar

Version 2.0.5 : 68/78 Update - April 23, 2021

- Allow compatibility to 87.0 (experimental support only)
- Add #44 increase maximum font sizes
- Add option for background color
- Add option for customizable borders w/CSS
- Fix #62, #8 Printing selected text w/Print command (not preview)
- Fix #53 handle embedded tables sizing
- Fix #50 localize headers for Japanese
- Fix #49, #30 layout issues, headers 
- Fix #46, #37, Japanese locale improvements @kiki-ja
- Fix #34 German locale improvements @RRoenn
- Fix #52 localize background color label

A big thanks for testers:
@RRoenn
@kiki-ja
@tidebre67 
@KC-T 
@madvinegar

Version 2.0.4 : 68/78 Update - March 9, 2021

- Move options on 78 to addons page 
- Fix show/hide headers 
- Fix short date format #28
- Fix line truncation #24
- Fix long attachment truncation #23
- Fix unpopulated printer list on install
- Dutch locale improvements - @Vistaus


Version 2.0.0 : 68/78 Update - January 3, 2021

- Upgraded for both 68/78 WL API
- New - Show/Hide headers #9
- New - Configurable number of attachments per line #18
- New icons for Microsoft office (XML files), 7zip, TIFF #6
- Remove old attachment separator #10

Version 0.1.3 : Locale/printer - June 12, 2020

- New Default Printer option (persistent)
- Fix missing translations
- Full locale list (original and new)
  (hy) Armenian, (ca) Catalan, (zh-CN) Chinese (Simplified), 
  (da) Danish, (nl) Dutch, (en) English, (fi) Finnish, 
  (fr) French, (gl) Galician, (de) German, (el) Greek, 
  (hu) Hungarian, (it) Italian, (ja) Japanese, (ko) Korean,
  (no) Norwegian, (pl) Polish, (pt-PT) Portuguese (Portugal), 
  (ru) Russian, (sk) Slovak, (sl) Slovenian, (es) Spanish, 
  (sv) Swedish, (uk) Ukrainian
- Thanks to @tidebre67 & @GeepsJay for the push/testing

Version 0.1.2 : Base port - June 7, 2020

- Fix version string

Version 0.1.1 : Base port - June 7, 2020 (unreleased)

- Fix CSS syntax

Version 0.1.0 : Base port - June 7, 2020 (unreleased)

- Baseline port of PrintingTools 1.3.0 for Thunderbird 68-72
- Consolidate options into one dialog
- New icon
