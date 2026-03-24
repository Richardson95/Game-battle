require_relative "boot"
require "rails/all"
Bundler.require(*Rails.groups)

module GameFound
  class Application < Rails::Application
    config.load_defaults 7.1
    config.time_zone = "UTC"
    config.secret_key_base = "arena_game_secret_key_abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678"
  end
end
