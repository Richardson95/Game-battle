class Score < ApplicationRecord
  validates :avatar_name, presence: true

  def self.leaderboard
    order(wins: :desc).limit(10)
  end

  def self.record_result(avatar, result)
    rec = find_or_create_by(avatar_name: avatar)
    case result
    when "win"  then rec.increment!(:wins)
    when "loss" then rec.increment!(:losses)
    when "draw" then rec.increment!(:draws)
    end
  end

  def win_rate
    total = wins + losses + draws
    return 0 if total.zero?
    ((wins.to_f / total) * 100).round(1)
  end
end
