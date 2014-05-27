var gulp = require('gulp');
var wrap = require('gulp-wrap');
var less = require('gulp-less');
var karma = require('gulp-karma');
var streamify = require('gulp-streamify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');


gulp.task('scripts', function () {
  return browserify('./src/scripts/sapphire.js', {bundleExternal: false})
    .bundle({standalone: 'sapphire'})
    .pipe(source('sapphire.js'))
    .pipe(streamify(wrap({src: './gulp/umd.jst'}, {deps: ['d3', 'strain']})))
    .pipe(gulp.dest("./build"));
});


gulp.task('styles', function () {
  return gulp
    .src('./src/styles/sapphire.less')
    .pipe(less())
    .pipe(gulp.dest('./build'));
});


gulp.task('build', function () {
  gulp.start('scripts', 'styles');
});


gulp.task('test', ['styles'], function() {
  return gulp
    .src([
      './bower_components/d3/d3.js',
      './bower_components/strain/strain.js',
      './build/sapphire.css',
      './src/scripts/**/*.js',
      './test/**/*.test.js'
    ])
    .pipe(karma({
      action: 'run',
      frameworks: ['mocha', 'chai', 'commonjs'],
      reporters: ['mocha'],
      browsers: ['PhantomJS'],
      preprocessors: {
        'src/scripts/**/*.js': ['commonjs'],
        'test/*.js': ['commonjs']
      }
    }));
});


gulp.task('default', function () {
  gulp.start('build');
});


gulp.task('watch', function() {
  gulp.watch('src/scripts/**/*.js', ['scripts']);
});
