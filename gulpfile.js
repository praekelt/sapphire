var sh = require('shelljs');
var gulp = require('gulp');
var less = require('gulp-less');
var karma = require('gulp-karma');
var jshint = require('gulp-jshint');
var webpack = require('webpack-stream');
var plumber = require('gulp-plumber');


var externals = {
  'd3': {
    root: 'd3',
    amd: 'd3',
    commonjs: 'd3',
    commonjs2: 'd3'
  },
  'strain': {
    root: 'strain',
    amd: 'strain',
    commonjs: 'strain',
    commonjs2: 'strain'
  }
};


gulp.task('build', [
  'scripts',
  'styles'
]);


gulp.task('styles', [
  'styles:modules',
  'styles:theme'
]);


gulp.task('scripts', [
  'scripts:standard'
]);


gulp.task('scripts:standard', function() {
  return build('sapphire.js', {externals: externals});
});


gulp.task('styles:modules', function () {
  return gulp.src('./src/styles/sapphire.less')
    .pipe(plumber())
    .pipe(less())
    .pipe(gulp.dest('./build'));
});


gulp.task('styles:theme', function () {
  return gulp.src('./src/styles/sapphire-theme.less')
    .pipe(plumber())
    .pipe(less())
    .pipe(gulp.dest('./build'));
});


gulp.task('test', ['styles'], function() {
  return gulp
    .src([
      './bower_components/d3/d3.js',
      './bower_components/strain/strain.js',
      './build/sapphire.css',
      './build/sapphire.js',
      './test/helpers.css',
      './test/testutils.js',
      './test/**/*.test.js'
    ])
    .pipe(karma({
      action: 'run',
      frameworks: ['mocha', 'chai'],
      reporters: ['mocha'],
      browsers: ['PhantomJS'],
      preprocessors: {
        './build/sapphire.js': ['sourcemap']
      }
    }));
});


gulp.task('lint', function() {
  return gulp
    .src([
      './gulpfile.js',
      './src/scripts/**/*.js',
      './test/**/*.js'
    ])
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'));
});


gulp.task('build:develop', function() {
  var branch = sh.exec('git symbolic-ref --short HEAD', {silent: true})
    .output
    .trim();

  if (branch !== 'develop') { return; }

  gulp.start('build', function() {
    sh.exec('git add ./build');
    sh.exec('git commit -m "Build"');
  });
});


gulp.task('install', function() {
  if (!sh.test('-d', './.git')) { return; }
  sh.mkdir('-p', './.git/hooks');

  var hookfile = './.git/hooks/post-merge';
  ['#!/bin/sh', 'npm run-script build:develop']
    .join('\n')
    .to(hookfile);
  sh.chmod('+x', hookfile);
});


gulp.task('ci', ['lint', 'test']);


gulp.task('default', ['build', 'test']);


gulp.task('watch', function() {
  gulp.watch('src/scripts/**/*.js', ['scripts']);
  gulp.watch('src/styles/**/*.less', ['styles']);
});


function build(filename, opts) {
  opts = opts || {};

  var s = gulp.src('src/scripts/index.js')
    .pipe(plumber())
    .pipe(webpack({
      output: {
        library: 'sapphire',
        libraryTarget: 'umd',
        filename: filename
      },
      devtool: '#source-map',
      externals: opts.externals || {}
    }));

  return s.pipe(gulp.dest('build'));
}
