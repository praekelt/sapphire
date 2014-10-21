# sapphire

![Build Status](https://api.travis-ci.org/praekelt/sapphire.png)

A js library for drawing dashboard widgets.

```javascript
d3.select('#rainbows-earthworms')
  .datum({
    title: 'Rainbows and Earthworms',
    values: [{
      x: 1405013457677,
      y: 1000000
    }, {
      x: 1405013458677,
      y: 9000000
    }]
  })
  .call(sapphire.widgets.bars());
```

## installation

Install [node.js](http://nodejs.org/)

Install bower globally:

```
# npm install -g bower
```

Or if you don't like globally installed things, from the repo's root:

```
$ npm install bower
$ ./node_modules/.bin/bower --help
```

Install the dependencies:

```
$ npm install
$ bower install
```

Run the tests to check if everything is happy:

```
$ gulp test
```

# [examples](examples/)

To view an example, open its `index.html` file in your browser. If the example has a `bower.json`, in the example's directory, do a: 

```
$ bower install
```

# development

After editing source scripts or files, do a:

```
$ gulp build
```

Or, keep a watch task running for rebuilds to happen on file changes:

```
$ gulp watch
```

To lint the changes:

```
$ gulp lint
```

# contribution

For reporting bugs, issues or feature requests, make a github issue. If you'd like to work on it, submit a pull request either linked to the corresponding issue, or referencing the corresponding issue via a github comment or git commit message. When submitting pull requests, *don't include* build file changes, they make reviews more difficult to review.
