# Seed sample leaderboard data
puts "Seeding leaderboard..."
[
  { avatar_name: "Richardson", wins: 12, losses: 4, draws: 2 },
  { avatar_name: "Atlas",      wins: 9,  losses: 7, draws: 1 },
  { avatar_name: "Maya",       wins: 8,  losses: 5, draws: 3 },
  { avatar_name: "Nova",       wins: 6,  losses: 6, draws: 4 },
  { avatar_name: "Zephyr",     wins: 5,  losses: 8, draws: 2 }
].each do |data|
  Score.find_or_create_by(avatar_name: data[:avatar_name]).update!(
    wins: data[:wins], losses: data[:losses], draws: data[:draws]
  )
end
puts "Done! #{Score.count} champions on the leaderboard."
