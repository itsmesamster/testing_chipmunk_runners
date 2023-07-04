# frozen_string_literal: true

require './scripts/env/paths'
require './scripts/env/env'
module Bindings
  DIST = "#{Paths::TS_BINDINGS}/dist"
  DIST_RS = "#{Paths::RS_BINDINGS}/dist"
  TARGET = "#{Paths::RS_BINDINGS}/target"
  SPEC = "#{Paths::TS_BINDINGS}/spec/build"
  TS_BINDINGS_LIB = "#{Paths::TS_BINDINGS}/src/native/index.node"
  TS_NODE_MODULES = "#{Paths::TS_BINDINGS}/node_modules"
  BUILD_ENV = "#{TS_NODE_MODULES}/.bin/electron-build-env"
  TARGETS = [DIST, TS_NODE_MODULES, TARGET, DIST_RS, SPEC, TS_BINDINGS_LIB].freeze
end

namespace :bindings do
  desc 'Install bindings'
  task :install do
    Shell.chdir(Paths::TS_BINDINGS) do
      Reporter.log 'Installing ts-binding libraries'
      Shell.sh 'yarn install'
      Reporter.done('bindings', 'installing', '')
    end
  end

  desc 'Lint TS bindings'
  task lint: 'bindings:install' do
    Shell.chdir(Paths::TS_BINDINGS) do
      Shell.sh 'yarn run lint'
      Reporter.done('bindings', 'linting', '')
    end
  end

  task build_spec: ['bindings:install'] do
    Shell.chdir("#{Paths::TS_BINDINGS}/spec") do
      Shell.sh "#{Bindings::TS_NODE_MODULES}/.bin/tsc -p tsconfig.json" unless File.exist?('./build')
    end
  end

  task run_tests: ['bindings:build_spec', 'bindings:build'] do
    Shell.chdir(Paths::TS_BINDINGS) do
      sh "#{Paths::JASMINE} spec/build/spec/session.jobs.spec.js"
      sh "#{Paths::JASMINE} spec/build/spec/session.search.spec.js"
      sh "#{Paths::JASMINE} spec/build/spec/session.values.spec.js"
      sh "#{Paths::JASMINE} spec/build/spec/session.extract.spec.js"
      sh "#{Paths::JASMINE} spec/build/spec/session.ranges.spec.js"
      sh "#{Paths::JASMINE} spec/build/spec/session.exporting.spec.js"
      sh "#{Paths::JASMINE} spec/build/spec/session.map.spec.js"
      sh "#{Paths::JASMINE} spec/build/spec/session.observe.spec.js"
      sh "#{Paths::JASMINE} spec/build/spec/session.indexes.spec.js"
      sh "#{Paths::JASMINE} spec/build/spec/session.concat.spec.js"
      sh "#{Paths::JASMINE} spec/build/spec/session.cancel.spec.js"
      sh "#{Paths::JASMINE} spec/build/spec/session.errors.spec.js"
      sh "#{Paths::JASMINE} spec/build/spec/session.stream.spec.js"
      sh "#{Paths::JASMINE} spec/build/spec/session.promises.spec.js"
    end
  end

  desc 'clean bindings'
  task :clean do
    Bindings::TARGETS.each do |path|
      if File.exist?(path)
        Shell.rm_rf(path)
        Reporter.removed('bindings', "removed: #{path}", '')
      end
    end
  end

  task copy_platform: 'platform:build' do
    platform_dest = "#{Bindings::TS_NODE_MODULES}/platform"
    Shell.rm_rf(platform_dest)
    FileUtils.cp_r(Paths::PLATFORM, Bindings::TS_NODE_MODULES)
  end

  desc 'Rebuild bindings'
  task rebuild: ['bindings:clean', 'bindings:build'] do
    Reporter.print
  end

  desc 'Build bindings'
  task build: ['bindings:copy_platform', 'bindings:install', 'environment:check'] do
    changes_to_rs = ChangeChecker.changes?(Paths::RS_BINDINGS)
    changes_to_ts = ChangeChecker.changes?(Paths::TS_BINDINGS)
    if changes_to_rs || changes_to_ts
      Shell.chdir(Paths::RS_BINDINGS) do
        Shell.sh "#{Bindings::BUILD_ENV} nj-cli build --release"
        ChangeChecker.reset(Paths::RS_BINDINGS, [Bindings::DIST_RS, Bindings::TARGET])
        Reporter.done('bindings', 'build rs bindings', '')
      end
      begin
        Shell.chdir(Paths::TS_BINDINGS) do
          Shell.sh 'yarn run build'
          ChangeChecker.reset(Paths::TS_BINDINGS,
                              [Bindings::DIST, Bindings::SPEC, Bindings::TS_NODE_MODULES])
          Reporter.done('bindings', 'build ts bindings', '')
        end
        FileUtils.cp "#{Paths::RS_BINDINGS}/dist/index.node", "#{Bindings::DIST}/native/index.node"
        dir_tests = "#{Paths::TS_BINDINGS}/src/native"
        mod_file = "#{dir_tests}/index.node"
        FileUtils.rm(mod_file)
        FileUtils.cp "#{Paths::RS_BINDINGS}/dist/index.node", "#{Paths::TS_BINDINGS}/src/native/index.node"
        Reporter.done('bindings', 'delivery', '')
      rescue StandardError
        Reporter.failed('bindings', 'build ts bindings', '')
      end
    else
      Reporter.skipped('bindings', 'build', '')
    end
    Reporter.print
  end
end
