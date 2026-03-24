class CreateGames < ActiveRecord::Migration[7.1]
  def change
    create_table :games do |t|
      t.string  :player1_avatar
      t.string  :player2_avatar
      t.string  :mode, default: "manual"
      t.string  :winner
      t.string  :status, default: "pending"
      t.integer :total_rounds, default: 0
      t.integer :player1_score, default: 0
      t.integer :player2_score, default: 0
      t.timestamps
    end

    create_table :scores do |t|
      t.string  :avatar_name
      t.integer :wins, default: 0
      t.integer :losses, default: 0
      t.integer :draws, default: 0
      t.timestamps
    end
  end
end
