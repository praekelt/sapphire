var gulp = require('gulp');
var wrap = require('gulp-wrap');
var less = require('gulp-less');
var karma = require('gulp-karma');
var streamify = require('gulp-streamify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');


gulp.task('scripts', function () {
  return browserify('./src/scripts/sapphire.js')
    .bundle({standalone: 'sapphire'})
    .pipe(source('sapphire.js'))
    .pipe(streamify(wrap({src: './gulp/umd.jst'}, {deps: ['d3', 'strain']})))
    .pipe(gulp.dest("./build"));
});


gulp.task('scripts:debug', function () {
  return browserify('./src/scripts/sapphire.js')
    .bundle({
      standalone: 'sapphire',
      debug: true
    })
    .pipe(source('sapphire.debug.js'))
    .pipe(gulp.dest("./build"));
});


gulp.task('styles', function () {
  return gulp
    .src('./src/styles/sapphire.less')
    .pipe(less())
    .pipe(gulp.dest('./build'));
});


gulp.task('build', function () {
  gulp.start('scripts', 'scripts:debug', 'styles');
});


gulp.task('test', ['scripts:debug', 'styles'], function() {
  return gulp
    .src([
      './bower_components/d3/d3.js',
      './bower_components/strain/strain.js',
      './build/sapphire.css',
      './build/sapphire.debug.js',
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


gulp.task('default', function () {
  gulp.start('build');
});


gulp.task('watch', function() {
  gulp.watch('src/scripts/**/*.js', ['scripts']);
});
