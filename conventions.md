# Conventions

## Helper classes

I've been getting into a pattern recently of splitting out an area of functionality from a class into its own class, with the only purpose being to reduce the size of the main class. (A side benefit is that the API feels nicer somehow: view.scroll.whatever() feels more relaxed than view.scrollWhatever(), like we've explicitly stepped into the scroll context before trying to interpret the next concept.)

Examples include `App.mainTabs`, `View.canvasHelpers` and `View.scroll`.

A classic OO approach might be to try and make these helper classes sensible nouns in their own right, like `ScrollController`, or to use inheritance (`View extends Scrollable`). Inheritance is obviously not the way to go here if only because JS only does single inheritance, and I don't think trying to turn the name into a noun gives any benefit. If you see a class that seems to not make sense as a standalone noun, it is a helper class in this pattern.

I have seriously considered adding a `-Stuff` suffix to some of these, as in "here's all the AST mode-related stuff", but that feels a little too informal.
