# frozen_string_literal: true

# Create compressed archive of application
class Compressor
  def initialize(location, archname)
    @location = location
    @archname = archname
  end

  def compress
    target = if OS.mac?
               './chipmunk.app'
             else
               '* .release'
             end
    @archname += '.tgz'
    Shell.chdir(@location) do
      Shell.sh "tar -czf ../#{@archname} #{target}"
    end
    Reporter.done('Compressor', "compressed: #{@archname}", '')
  end
end
