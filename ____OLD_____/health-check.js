// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
// jshint -W106
(function() {
  'use strict';

  angular
    .module('health-check', [])
    .controller('ProjectListController', ProjectListController);

  ProjectListController.$inject = ['$http', '$q', '$log'];

  function ProjectListController($http, $q, $log) {
    var vm = this;
    vm.error = null;
    vm.projects = [];
    vm.hasOutdatedProjects = false;
    vm.hasProjectsWithIssues = false;
    vm.isOutdated = isOutdated;
    vm.hasIssues = hasIssues;
    vm.isHealthy = isHealthy;
    vm.options = {
      deps: true,
      username: '',
      include: [],
      exclude: []
    };

    activate();

    function activate() {
      getOptions();
      getProjects()
        .then(calculateProjectStats)
        .then(getDependencies)
        .then(calculateDependencyStats)
        .catch(handleError);
    }

    /**
     * Get options from the querystring
     */
    function getOptions() {
      // TODO
      vm.options.deps = true;
      vm.options.username = 'JamesMessinger';
      vm.options.include = [];
      vm.options.exclude = ['cordova-test-app', 'generator-npm', 'swagger-suite', 'super-powered-api-testing'];
    }

    /**
     * Gets the list of projects from GitHub.
     *
     * @returns {Promise}
     */
    function getProjects() {
      return $http.get('https://api.github.com/users/' + vm.options.username + '/repos')
        .success(function(projects) {
          var included = [], excluded = [];

          projects.forEach(function(project) {
            // By default, only include JavaScript projects that belong to us (not forks)
            var include = project.language === 'JavaScript' && !project.fork;

            if (vm.options.include.indexOf(project.name) >= 0) {
              include = true;
            }

            if (vm.options.exclude.indexOf(project.name) >= 0) {
              include = false;
            }

            (include ? included : excluded).push(project);
          });

          $log.debug('Included Projects', included.length, included);
          $log.debug('Excluded Projects', excluded.length, excluded);
          vm.projects = included;
        });
    }

    /**
     * Gets the dependency data for each project from David-DM.
     *
     * @returns {Promise}
     */
    function getDependencies() {
      if (vm.options.deps) {
        return $q.all(vm.projects.map(function(project) {
          return $http.get('https://david-dm.org/' + vm.options.username + '/' + project.name + '/info.json')
            .success(function(deps) {
              $log.debug(project.name + ' dependencies', deps);
              angular.extend(project, deps);

              project.totals.total = project.totals.upToDate + project.totals.outOfDate;
              project.totals.html_url = 'https://david-dm.org/' + vm.options.username + '/' + project.name + '/';
            })
            .catch(handleError);
        }));
      }
    }

    /**
     * Calculates stats for each project.
     */
    function calculateProjectStats() {
      vm.projects.forEach(function(project) {
        project.popularity = project.forks_count + project.stargazers_count + project.watchers_count;
        vm.hasProjectsWithIssues = vm.hasProjectsWithIssues || hasIssues(project);
      });
    }

    /**
     * Calculates stats for each project's dependencies.
     */
    function calculateDependencyStats() {
      vm.projects.forEach(function(project) {
        vm.hasOutdatedProjects = vm.hasOutdatedProjects || isOutdated(project);
      });
    }

    /**
     * Are the project's dependencies outdated?
     *
     * @param {object} project
     * @returns {boolean}
     */
    function isOutdated(project) {
      return project.totals && (project.totals.outOfDate > 0 || project.totals.advisories > 0);
    }

    /**
     * Does the project have open issues?
     *
     * @param {object} project
     * @returns {boolean}
     */
    function hasIssues(project) {
      return project.open_issues_count > 0;
    }

    /**
     * Is the project healthy?
     *
     * @param {object} project
     * @returns {boolean}
     */
    function isHealthy(project) {
      return !isOutdated(project) && !hasIssues(project);
    }

    /**
     * Displays and logs the given error.
     *
     * @param {Error} err
     */
    function handleError(err) {
      var error = err;
      if (!(err instanceof Error)) {
        if (err.config && err.config.url) {
          error = new Error('HTTP request failed: ' + err.config.url);
        }
        else {
          error = new Error('Something\'s gone wrong, but I don\'t know what');
        }
      }
      vm.error = error;
      $log.error(error.message, err);
    }
  }

})();
