import { z } from "zod"

export const resultFinalStageSchema = z.enum([
  "CHAMPION",
  "RUNNER_UP",
  "SEMIFINAL",
  "QUARTERFINAL",
  "ROUND_OF_16",
  "ROUND_OF_32",
  "GROUP_STAGE",
])

export const manualResultRowSchema = z.object({
  modality: z.enum(["VARONIL", "FEMENIL", "MIXTO"]),
  category: z.string().min(1),
  finalStage: resultFinalStageSchema,
  player1Id: z.string().cuid().optional(),
  player2Id: z.string().cuid().optional(),
  importedPlayer1Name: z.string().optional(),
  importedPlayer2Name: z.string().optional(),
}).refine(
  (value) => Boolean((value.player1Id && value.player2Id) || (value.importedPlayer1Name && value.importedPlayer2Name)),
  { message: "Debes enviar pareja por IDs o por nombres importados" }
)

export const manualResultsSubmissionSchema = z.object({
  rows: z.array(manualResultRowSchema).min(1),
  notes: z.string().optional(),
})

export const importResultsRequestSchema = z.object({
  fileName: z.string().min(3),
  rows: z.array(z.record(z.string(), z.unknown())).min(1),
  notes: z.string().optional(),
})
