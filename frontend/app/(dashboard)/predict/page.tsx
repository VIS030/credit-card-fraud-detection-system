"use client"

import React, { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShapForcePlot } from "@/components/ml/shap-force-plot"
import { PRESETS } from "@/lib/mock-data"
import { ShieldCheck, AlertTriangle, Play, RefreshCw, Layers, Sliders } from "lucide-react"
import { ApiClient } from "@/lib/api-client"
import type { PredictResponse } from "@/lib/types"

const pcaFields = Object.fromEntries(
  Array.from({ length: 28 }, (_, i) => [`V${i + 1}`, z.coerce.number()])
) as Record<string, z.ZodCoercedNumber>

const predictionSchema = z.object({
  time: z.coerce.number().min(0, "Time must be 0 or greater"),
  amount: z.coerce.number().min(0, "Amount cannot be negative"),
  ...pcaFields,
})

type PredictionFormValues = z.infer<typeof predictionSchema>

const emptyPca = Object.fromEntries(Array.from({ length: 28 }, (_, i) => [`V${i + 1}`, 0])) as Record<string, number>

export default function SinglePredictPage() {
  const [running, setRunning] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<PredictResponse | null>(null)
  const [loadedPreset, setLoadedPreset] = useState<string | null>(null)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PredictionFormValues>({
    resolver: zodResolver(predictionSchema) as any,
    defaultValues: {
      time: 0,
      amount: 0,
      ...emptyPca,
    },
  })

  const watched = watch()
  const pcaAllZero = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => Number((watched as any)[`V${i + 1}`] || 0)).every((v) => Math.abs(v) < 1e-12)
  }, [watched])

  const handleLoadPreset = (type: "legitimate" | "highRisk" | "borderline") => {
    const preset = PRESETS[type]
    setValue("time", preset.time)
    setValue("amount", preset.amount)
    Object.entries(preset.pcaFeatures).forEach(([key, val]) => {
      setValue(key as keyof PredictionFormValues, val)
    })
    setLoadedPreset(preset.label)
    setResult(null)
    setError("")
  }

  const onSubmit = async (data: PredictionFormValues) => {
    setRunning(true)
    setResult(null)
    setError("")

    const pca_features: Record<string, number> = {}
    for (let i = 1; i <= 28; i++) {
      pca_features[`V${i}`] = Number((data as any)[`V${i}`])
    }

    if (Object.values(pca_features).every((v) => Math.abs(v) < 1e-12)) {
      setError("V1–V28 cannot all be zero. These are PCA components from the trained dataset. Load a demo profile or paste a real feature vector.")
      setRunning(false)
      return
    }

    try {
      const res = await ApiClient.predictSingle({
        time: Number(data.time),
        amount: Number(data.amount),
        pca_features,
      })
      setResult(res)
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Prediction request failed."
      setError(errorMsg)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Manual Risk Evaluation Panel</h1>
        <p className="text-sm text-muted">
          The trained model expects Time, Amount, and PCA-transformed features V1–V28. Changing only Time or Amount while leaving V1–V28 at zero is not a valid transaction.
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/2">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4.5 w-4.5 text-primary" />
            <span className="text-xs font-semibold text-zinc-300">
              Demo profiles send complete 30-feature vectors from the original PCA space
            </span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button variant="secondary" size="sm" onClick={() => handleLoadPreset("legitimate")} className="text-xs">
              Load Legit Profile
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleLoadPreset("borderline")} className="text-xs">
              Load Borderline Profile
            </Button>
            <Button variant="danger" size="sm" onClick={() => handleLoadPreset("highRisk")} className="text-xs">
              Load Fraud Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {pcaAllZero && (
        <div className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-xs text-zinc-200">
          V1–V28 are currently all zero. Time and Amount alone cannot represent a credit-card transaction for this model. Use a demo profile or paste PCA values from `creditcard.csv`.
        </div>
      )}

      {loadedPreset && (
        <p className="text-xs text-muted">Loaded profile: <span className="text-zinc-200">{loadedPreset}</span></p>
      )}

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Inference Parameters</CardTitle>
                <CardDescription>Time is seconds elapsed in the source dataset, not a clock time.</CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  reset()
                  setResult(null)
                  setError("")
                  setLoadedPreset(null)
                }}
                className="text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Reset
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 border-b border-border/50 pb-5">
                <Input label="Time Index (Seconds)" type="number" step="any" error={errors.time?.message} {...register("time")} />
                <Input label="Transaction Amount ($)" type="number" step="any" error={errors.amount?.message} {...register("amount")} />
              </div>
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">
                  PCA Transformed Features (V1 to V28)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {Array.from({ length: 28 }).map((_, i) => {
                    const fieldName = `V${i + 1}` as keyof PredictionFormValues
                    return (
                      <Input
                        key={fieldName}
                        label={fieldName}
                        type="number"
                        step="any"
                        className="h-8 py-1 text-xs"
                        error={errors[fieldName]?.message}
                        {...register(fieldName)}
                      />
                    )
                  })}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={running} className="text-xs h-10 w-full sm:w-auto">
                {running ? (
                  <>
                    <RefreshCw className="h-4.5 w-4.5 mr-1.5 animate-spin" />
                    Running model inference...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1.5" />
                    Evaluate Anomaly Score
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Inference Report</CardTitle>
              <CardDescription>Scores below come from the backend XGBoost model, not a UI estimate.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
              {!result && !running && (
                <div className="text-center py-10 space-y-2">
                  <div className="h-10 w-10 rounded-full border border-border flex items-center justify-center mx-auto text-muted">
                    <Sliders className="h-5 w-5" />
                  </div>
                  <span className="text-xs text-muted block max-w-[200px] mx-auto">
                    Load a demo profile or enter a full feature vector, then evaluate.
                  </span>
                </div>
              )}

              {running && (
                <div className="text-center py-10 space-y-3">
                  <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto" />
                  <span className="text-xs text-muted block">Scoring with the loaded XGBoost model...</span>
                </div>
              )}

              {result && !running && (
                <div className="w-full space-y-6">
                  <div className="text-center space-y-2 pb-5 border-b border-border/50">
                    <span className="text-[10px] uppercase text-muted font-bold block tracking-wider">Fraud Likelihood</span>
                    <span className={`text-4xl font-extrabold font-mono block ${result.prediction_class === 1 ? "text-danger" : "text-success"}`}>
                      {(result.fraud_probability * 100).toFixed(2)}%
                    </span>
                    <div className="inline-flex items-center gap-1.5 mt-2">
                      {result.prediction_class === 1 ? (
                        <span className="text-xs text-danger font-semibold bg-danger/10 px-2 py-0.5 rounded flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Flagged as fraud
                        </span>
                      ) : (
                        <span className="text-xs text-success font-semibold bg-success/10 px-2 py-0.5 rounded flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Classified as legitimate
                        </span>
                      )}
                    </div>
                  </div>

                  <ShapForcePlot shapValues={result.shap_values || {}} predictionClass={result.prediction_class} />

                  {(result.risk_factors || []).length > 0 && (
                    <div className="p-3.5 rounded-lg border border-border bg-[#09090b]/80 space-y-1.5">
                      <span className="text-[10px] uppercase text-muted font-bold block tracking-wider">Identified Risk Markers</span>
                      <ul className="list-disc pl-4 space-y-1 text-[11px] text-zinc-300">
                        {result.risk_factors.map((rf, i) => (
                          <li key={i}>{rf}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
