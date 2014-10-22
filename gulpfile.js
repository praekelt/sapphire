var sh = require('shelljs');
var gulp = require('gulp');
var wrap = require('gulp-wrap');
var less = require('gulp-less');
var karma = require('gulp-karma');
var streamify = require('gulp-streamify');
var browserify = require('browserify');
var jshint = require('gulp-jshint');
var source = require('vinyl-source-stream');
var version = require('./bower').version;


gulp.task('scripts', function () {
  return browserify('./src/scripts/index.js')
    .bundle({standalone: 'sapphire'})
    .on('error', error)
    .pipe(source('sapphire.js'))
    .pipe(streamify(wrap({src: '.umd.jst'}, {
      version: version,
      deps: ['d3', 'strain']
    })))
    .pipe(gulp.dest("./build"));
});


gulp.task('scripts:debug', function () {
  return browserify('./src/scripts/index.js')
    .bundle({
      standalone: 'sapphire',
      debug: true
    })
    .on('error', error)
    .pipe(source('sapphire.debug.js'))
    .pipe(gulp.dest("./build"));
});


gulp.task('styles', function () {
  return gulp
    .src('./src/styles/sapphire.less')
    .pipe(less())
    .on('error', error)
    .pipe(gulp.dest('./build'));
});


gulp.task('test', ['scripts:debug', 'styles'], function() {
  return gulp
    .src([
      './bower_components/d3/d3.js',
      './bower_components/strain/strain.js',
      './build/sapphire.css',
      './build/sapphire.debug.js',
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
        './build/sapphire.debug.js': ['sourcemap']
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


gulp.task('build', function () {
  gulp.start('scripts', 'scripts:debug', 'styles');
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
  gulp.watch('src/scripts/**/*.js', ['scripts', 'scripts:debug']);
  gulp.watch('src/styles/**/*.less', ['styles']);
});


function error(e) {
  console.error(e.toString());
  this.emit('end');
}
