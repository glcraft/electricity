{
  "targets": [
    {
      "target_name": "extract-icon",
      "sources": [ "main.cpp","lodepng.cpp" ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")"
      ]
    }
  ]
}