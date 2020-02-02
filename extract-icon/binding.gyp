{
  "targets": [
    {
      "target_name": "geticon",
      "sources": [ "main.cpp","lodepng.cpp" ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")"
      ]
    }
  ]
}