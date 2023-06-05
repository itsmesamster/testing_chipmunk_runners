class Utils
  def initialize(reinstall, rebuild)
    @pkg = "#{Paths::UTILS}/pkg"
    @target = "#{Paths::UTILS}/target"
    @node_modules = "#{Paths::UTILS}/node_modules"
    @test_output = "#{Paths::UTILS}/test_output"
    @reinstall = reinstall
    @rebuild = rebuild
    @installed = File.exist?("#{Paths::UTILS}/node_modules")
    @targets = [@pkg, @target, @node_modules, @test_output]
    @changes_to_files = ChangeChecker.has_changes?(Paths::UTILS, @targets)
  end
  
  def changes_to_files
    @changes_to_files
  end

  def clean
    @targets.each do |path|
      if File.exist?(path)
        Shell.rm_rf(path)
        Reporter.removed(self, "removed: #{path}", '')
      else
        Reporter.other(self, "doesn't exist: #{path}", '')
      end
    end
  end
  
  def install
    Shell.rm_rf(@node_modules) if @reinstall
    if !@installed || @reinstall
      Shell.chdir(Paths::UTILS) do
        Shell.sh 'yarn install'
        Reporter.done(self, 'installing', '')
      end
    else
      Reporter.skipped(self, 'installing', '')
    end
  end
  
  def build
    if !@changes_to_files && !@rebuild
      Reporter.skipped(self, 'already built', '')
    else
      Environment.check
      [@pkg, @target].each do |path|
        Shell.rm_rf(path)
        Reporter.removed(self, path, '')
      end
      Shell.chdir(Paths::UTILS) do
        Shell.sh 'wasm-pack build --target bundler'
      end
      Reporter.done(self, "build #{@target}", '')
    end
  end
end
  