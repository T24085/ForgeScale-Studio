$ErrorActionPreference = 'Stop'

$project = 'C:/Users/chris/Desktop/3D Printing'
$imageCli = 'C:/Users/chris/.codex/skills/imagegen/scripts/image_gen.py'
$soraCli = 'C:/Users/chris/.codex/skills/sora/scripts/sora.py'

if (-not $env:OPENAI_API_KEY) {
  Write-Error 'OPENAI_API_KEY is not set. Set it and rerun this script.'
}

New-Item -ItemType Directory -Force -Path "$project/output/imagegen","$project/output/sora","$project/output/sora/jobs" | Out-Null

python $imageCli generate-batch `
  --input "$project/prompts/image-prompts.jsonl" `
  --out-dir "$project/output/imagegen" `
  --quality high `
  --size 1536x1024 `
  --concurrency 3

python $soraCli create-batch `
  --input "$project/prompts/video-prompts.jsonl" `
  --out-dir "$project/output/sora/jobs" `
  --model sora-2 `
  --size 1280x720 `
  --seconds 8 `
  --concurrency 1

Write-Host 'Video jobs created. Poll and download each job with:'
Write-Host "python $soraCli poll --id <video_id> --download --variant video --out '$project/output/sora/<name>.mp4'"
