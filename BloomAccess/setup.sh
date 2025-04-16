#!/bin/bash

echo "🚀 Starting project setup..."

# Step 1: Install Node dependencies
echo "📦 Installing Node modules..."
npm install 

# Step 2: Set up Ruby (optional - only if you're using rbenv and a .ruby-version file)
if command -v rbenv &> /dev/null && [ -f ".ruby-version" ]; then
  echo "💎 Setting up Ruby version..."
  rbenv install -s
  rbenv local "$(cat .ruby-version)"
  gem install bundler
  bundle install
fi

# Step 3: CocoaPods setup
echo "📲 Installing iOS Pods..."
cd ios || exit
pod install
cd ..

# Step 4: Clear Watchman watches (optional but helps avoid EMFILE errors)
if command -v watchman &> /dev/null; then
  echo "🧹 Cleaning Watchman watches..."
  watchman watch-del-all
fi

# Step 5: Expo start
echo "✅ Setup complete!"
echo "👉 You can now run the project using:"
echo "   npx expo run:ios  or  npx expo start"

exit 0

# to run
# chmod +x setup.sh
# ./setup.sh
