Rails.application.routes.draw do
  root "games#index"
  resources :games, only: [:index, :create, :show] do
    collection do
      get :leaderboard
    end
  end
  resources :scores, only: [:create]
end
