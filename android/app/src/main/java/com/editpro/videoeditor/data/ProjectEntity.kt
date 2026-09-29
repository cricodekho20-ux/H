package com.editpro.videoeditor.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "projects")
data class ProjectEntity(
    @PrimaryKey val id: String,
    val name: String,
    val aspectRatio: String,
    val durationSeconds: Double,
    val resolution: String,
    val fps: Int,
    val lastEditedTimestamp: Long,
    val thumbnailUri: String?,
    val clipsJson: String
)
